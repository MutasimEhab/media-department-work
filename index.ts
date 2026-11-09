// Vercel's Express entry point. The application and routes remain in backend/src.
import express from 'express';
import app from './backend/src/index.js';

// Vercel detects Express by checking that the root entry point imports it.
void express;

export default app;
