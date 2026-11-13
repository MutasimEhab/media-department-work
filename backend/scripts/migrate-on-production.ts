const isProductionDeployment = process.env.VERCEL_ENV === 'production'
  || (process.env.VERCEL === '1' && process.env.VERCEL_GIT_COMMIT_REF === 'main');

if (isProductionDeployment) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Production deployment is missing DATABASE_URL; refusing to deploy without applying database migrations.');
  }
  console.log('Applying pending production database migrations.');
  await import('./migrate.js');
} else {
  console.log('Skipping database migrations outside the Vercel production environment.');
}
