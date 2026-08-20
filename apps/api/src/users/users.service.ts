import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

export type AuthUserRecord = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });
  }

  findSafeById(id: string): Promise<Omit<AuthUserRecord, "passwordHash"> | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
  }

  async create(input: { email: string; name: string; passwordHash: string }): Promise<AuthUserRecord> {
    try {
      return await this.prisma.user.create({
        data: input,
        select: { id: true, email: true, name: true, passwordHash: true },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Email is already registered");
      }
      throw error;
    }
  }
}
