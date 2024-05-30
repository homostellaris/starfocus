import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const registerEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("email_registrations", { email: args.email });
  },
});
