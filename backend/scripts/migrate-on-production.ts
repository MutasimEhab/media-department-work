if (process.env.VERCEL_ENV === 'production') {
  await import('./migrate.js');
} else {
  console.log('Skipping database migrations outside the Vercel production environment.');
}
