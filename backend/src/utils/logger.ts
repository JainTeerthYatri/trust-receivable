export const logger = {
  info: (message: string, extra?: unknown) => {
    const ts = new Date().toISOString();
    if (extra) console.info(`[${ts}] INFO ${message}`, extra);
    else console.info(`[${ts}] INFO ${message}`);
  },
  warn: (message: string, extra?: unknown) => {
    const ts = new Date().toISOString();
    if (extra) console.warn(`[${ts}] WARN ${message}`, extra);
    else console.warn(`[${ts}] WARN ${message}`);
  },
  error: (message: string, extra?: unknown) => {
    const ts = new Date().toISOString();
    if (extra) console.error(`[${ts}] ERROR ${message}`, extra);
    else console.error(`[${ts}] ERROR ${message}`);
  }
};
