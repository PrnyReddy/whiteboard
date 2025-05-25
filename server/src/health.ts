import express from 'express';

const healthRouter = express.Router();

healthRouter.get('/health', (_, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'whiteboard-server'
  });
});

export default healthRouter;
