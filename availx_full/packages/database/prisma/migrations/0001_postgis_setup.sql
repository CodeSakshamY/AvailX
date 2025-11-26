-- ===========================
-- AVAILX PostGIS Setup Migration
-- Version: 1.0
-- Purpose: Enable PostGIS extension and add geospatial capabilities
-- ===========================

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS version
SELECT PostGIS_version();

-- ===========================
-- 2. Add geometry column to provider_profiles
-- ===========================

-- Add location_geom column (Point geometry, SRID 4326 = WGS 84)
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS location_geom geometry(Point, 4326);

-- ===========================
-- 3. Create function to sync JSON lat/lng to geometry column
-- ===========================

CREATE OR REPLACE FUNCTION sync_provider_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if baseLocation contains lat/lng
  IF NEW."baseLocation" IS NOT NULL
     AND NEW."baseLocation"::jsonb ? 'lat'
     AND NEW."baseLocation"::jsonb ? 'lng' THEN

    NEW.location_geom := ST_SetSRID(
      ST_MakePoint(
        (NEW."baseLocation"::jsonb->>'lng')::float,
        (NEW."baseLocation"::jsonb->>'lat')::float
      ),
      4326
    );
  ELSE
    NEW.location_geom := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 4. Create trigger to automatically sync on INSERT/UPDATE
-- ===========================

DROP TRIGGER IF EXISTS sync_provider_location_trigger ON provider_profiles;

CREATE TRIGGER sync_provider_location_trigger
  BEFORE INSERT OR UPDATE ON provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_provider_location();

-- ===========================
-- 5. Backfill existing provider locations
-- ===========================

UPDATE provider_profiles
SET location_geom = ST_SetSRID(
  ST_MakePoint(
    ("baseLocation"::jsonb->>'lng')::float,
    ("baseLocation"::jsonb->>'lat')::float
  ),
  4326
)
WHERE "baseLocation" IS NOT NULL
  AND "baseLocation"::jsonb ? 'lat'
  AND "baseLocation"::jsonb ? 'lng';

-- ===========================
-- 6. Create spatial index (GIST)
-- ===========================

-- GIST index for fast spatial queries (O(log n) instead of O(n))
CREATE INDEX IF NOT EXISTS idx_provider_profiles_location_gist
ON provider_profiles
USING GIST (location_geom);

-- ===========================
-- 7. Additional performance indexes
-- ===========================

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_provider_profiles_active_category_rating
ON provider_profiles ("isActive", "categoryId", "averageRating" DESC)
WHERE "isActive" = true AND "profileStatus" = 'APPROVED';

-- Index for reputation-based sorting
CREATE INDEX IF NOT EXISTS idx_provider_profiles_reputation
ON provider_profiles ("reputationScore" DESC, "averageRating" DESC)
WHERE "isActive" = true;

-- ===========================
-- 8. Create helper functions for common queries
-- ===========================

-- Function to find providers within radius (in kilometers)
CREATE OR REPLACE FUNCTION find_providers_within_radius(
  search_lat float,
  search_lng float,
  radius_km float,
  category_filter text DEFAULT NULL,
  min_rating decimal DEFAULT NULL,
  aadhaar_verified_filter boolean DEFAULT NULL,
  result_limit int DEFAULT 50
)
RETURNS TABLE (
  id text,
  "userId" text,
  "businessName" text,
  description text,
  "categoryId" text,
  "baseLocation" jsonb,
  "averageRating" decimal,
  "reputationScore" decimal,
  "completedJobs" int,
  "aadhaarVerified" boolean,
  "backgroundVerified" boolean,
  "responseTimeSeconds" int,
  distance_km float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p."userId",
    p."businessName",
    p.description,
    p."categoryId",
    p."baseLocation",
    p."averageRating",
    p."reputationScore",
    p."completedJobs",
    p."aadhaarVerified",
    p."backgroundVerified",
    p."responseTimeSeconds",
    -- Calculate distance in kilometers
    ROUND(
      CAST(
        ST_Distance(
          p.location_geom::geography,
          ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
        ) / 1000 AS numeric
      ),
      2
    )::float AS distance_km
  FROM provider_profiles p
  WHERE
    -- Spatial filter using ST_DWithin (very fast with GIST index)
    ST_DWithin(
      p.location_geom::geography,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      radius_km * 1000  -- Convert km to meters
    )
    AND p."isActive" = true
    AND p."profileStatus" = 'APPROVED'
    -- Optional category filter
    AND (category_filter IS NULL OR p."categoryId" = category_filter)
    -- Optional rating filter
    AND (min_rating IS NULL OR p."averageRating" >= min_rating)
    -- Optional Aadhaar verification filter
    AND (aadhaar_verified_filter IS NULL OR p."aadhaarVerified" = aadhaar_verified_filter)
  ORDER BY
    distance_km ASC,
    p."reputationScore" DESC,
    p."averageRating" DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get provider count within radius
CREATE OR REPLACE FUNCTION count_providers_within_radius(
  search_lat float,
  search_lng float,
  radius_km float,
  category_filter text DEFAULT NULL
)
RETURNS int AS $$
DECLARE
  provider_count int;
BEGIN
  SELECT COUNT(*)::int INTO provider_count
  FROM provider_profiles p
  WHERE
    ST_DWithin(
      p.location_geom::geography,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      radius_km * 1000
    )
    AND p."isActive" = true
    AND p."profileStatus" = 'APPROVED'
    AND (category_filter IS NULL OR p."categoryId" = category_filter);

  RETURN provider_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 9. Full-text search setup (optional, for future use)
-- ===========================

-- Add tsvector column for full-text search
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_provider_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW."businessName", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector
DROP TRIGGER IF EXISTS update_provider_search_vector_trigger ON provider_profiles;

CREATE TRIGGER update_provider_search_vector_trigger
  BEFORE INSERT OR UPDATE ON provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_search_vector();

-- Backfill search vectors
UPDATE provider_profiles
SET search_vector =
  setweight(to_tsvector('english', COALESCE("businessName", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B');

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_provider_profiles_search_vector
ON provider_profiles
USING GIN (search_vector);

-- ===========================
-- 10. Verify setup
-- ===========================

-- Check that PostGIS extension is installed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'postgis'
  ) THEN
    RAISE EXCEPTION 'PostGIS extension not installed!';
  END IF;
END $$;

-- Output summary
SELECT
  'PostGIS Setup Complete' AS status,
  COUNT(*) AS total_providers,
  COUNT(location_geom) AS providers_with_location,
  COUNT(search_vector) AS providers_with_search_vector
FROM provider_profiles;

-- ===========================
-- END OF MIGRATION
-- ===========================
