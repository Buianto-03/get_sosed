type GeoObjectPoint = {
    pos: string;
  };
  
  type GeoObject = {
    Point: GeoObjectPoint;
  };
  
  type FeatureMember = {
    GeoObject: GeoObject;
  };
  
  type GeoObjectCollection = {
    featureMember: FeatureMember[];
  };
  
  type ResponseData = {
    GeoObjectCollection: GeoObjectCollection;
  };
  
  export type ApiResponse = {
    response: ResponseData;
  };
  