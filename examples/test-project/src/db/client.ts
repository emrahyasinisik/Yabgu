/** Shared Prisma client — do not construct another instance. */
export const prisma = {
  user: {
    async findMany() {
      return [] as Array<{ id: string; email: string; name: string }>;
    },
    async create(args: { data: { email: string; name: string } }) {
      return { id: "stub", ...args.data };
    },
  },
};
