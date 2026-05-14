import { economicCalendarRouter } from "@/modules/economic-calendar/routers/economicCalendar.router";
import { router } from "@/trpc/trpc";

export const appRouter = router({
  economicCalendar: economicCalendarRouter,
});

export type AppRouter = typeof appRouter;
