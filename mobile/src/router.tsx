import * as React from "react";
import { RouterProvider } from "@expo/router";
import App from "./App";

const router = () => <RouterProvider root={App} />;

export default router;