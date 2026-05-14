import type { ReactNode } from "react";
import { Card } from "../ui/card";

type MapSurfaceProps = {
  className: string;
  children?: ReactNode;
};

function MapSurface({ className, children }: MapSurfaceProps) {
  return <Card className={className}>{children}</Card>;
}

export default MapSurface;
