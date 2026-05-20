import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import factionsRouter from "./factions";
import charactersRouter from "./characters";
import serversRouter from "./servers";
import channelsRouter from "./channels";
import messagesRouter from "./messages";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(factionsRouter);
router.use(charactersRouter);
router.use(serversRouter);
router.use(channelsRouter);
router.use(messagesRouter);

export default router;
