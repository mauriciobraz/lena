import { PrismaClient } from '@prisma/client';

export namespace PrivateVoiceQueries {
  export interface ConfigureArgs {
    categoryId: string;
    guildId: string;
    parentId: string;
    allowChangeName: boolean;
  }

  export async function configure(
    conn: PrismaClient,
    { allowChangeName, categoryId, guildId, parentId }: ConfigureArgs
  ) {
    return await conn.guild.upsert({
      where: {
        id: guildId,
      },
      create: {
        id: guildId,
        PrivateVoiceConfig: {
          create: { categoryId, parentId, allowChangeName },
        },
      },
      update: {
        PrivateVoiceConfig: {
          upsert: {
            create: { categoryId, parentId, allowChangeName },
            update: { categoryId, parentId, allowChangeName },
          },
        },
      },
    });
  }
}
