import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import proyectosRouter from "./proyectos";
import tareasRouter from "./tareas";
import bugsRouter from "./bugs";
import equipoRouter from "./equipo";
import buildsRouter from "./builds";
import notificacionesRouter from "./notificaciones";
import dashboardRouter from "./dashboard";
import chatRouter from "./chat";
import extensionesRouter from "./extensiones";
import comentariosRouter from "./comentarios";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(proyectosRouter);
router.use(tareasRouter);
router.use(bugsRouter);
router.use(equipoRouter);
router.use(buildsRouter);
router.use(notificacionesRouter);
router.use(dashboardRouter);
router.use(chatRouter);
router.use(extensionesRouter);
router.use(comentariosRouter);
router.use(pushRouter);

export default router;
