/** OpenAPI `PredictionDto`. */
export interface PredictionDto {
  id: string;
  securityId: string;
  predictedPrice: number;
  direction: string;
  confidenceScore: number;
  inputWindowLength: number;
  generatedAt: string;
  modelVersion: string;
}
