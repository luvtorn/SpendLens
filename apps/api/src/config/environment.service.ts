import { Injectable } from "@nestjs/common";
import { parseEnvironment, type Environment } from "@/config/environment";

@Injectable()
export class EnvironmentService {
  readonly values: Environment = parseEnvironment(process.env);
}
