module.exports = ({
  express,
  httpStatus: { OK, INTERNAL_SERVER_ERROR },
  mongoClient
}) => {
  const router = express.Router();

  /**
   * get current service health
   */
  router.get('/current', async (req, res, next) => {
    const healthy = await mongoClient.test();
    res
      .status(healthy ? OK : INTERNAL_SERVER_ERROR)
      .json({ mongo: { healthy } });
    next();
  });

  router.get('ping', (req, res, next) => {
    res.status(OK).send({
      message: 'pong'
    });
    next();
  });

  return router;
};
