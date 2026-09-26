// Central place for environment variables, with clear errors when one is missing.

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local (or set it in your hosting dashboard).`
    );
  }
  return value;
}

export const env = {
  get MONGODB_URI() {
    return required("MONGODB_URI");
  },
};

/** GitHub sign-in is optional: it's only offered when both keys are set. */
export const githubEnabled = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET);
