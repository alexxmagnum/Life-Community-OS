declare module "*.geojson" {
  const value: {
    type: "FeatureCollection";
    features: unknown[];
    [key: string]: unknown;
  };
  export default value;
}

declare module "*.json" {
  const value: Record<string, unknown>;
  export default value;
}
