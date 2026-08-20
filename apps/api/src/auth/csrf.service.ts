import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { EnvironmentService } from "@/config/environment.service";

@Injectable()
export class CsrfService {
  constructor(private readonly environment: EnvironmentService) {}

  create(): string {
    const nonce = randomBytes(32).toString("base64url");
    return `${nonce}.${this.signature(nonce)}`;
  }

  verify(token: string): boolean {
    const [nonce, signature] = token.split(".");
    if (!nonce || !signature) return false;
    const expected = this.signature(nonce);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  }

  equals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }

  private signature(nonce: string): string {
    return createHmac("sha256", this.environment.values.CSRF_SECRET).update(nonce).digest("base64url");
  }
}
