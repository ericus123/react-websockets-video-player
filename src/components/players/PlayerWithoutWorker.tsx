import { FC, useEffect, useRef, useState } from "react";
import { log } from "../../helpers/log";
import { WsPlayerProps } from "../../types";
import PlayerLoader from "../loader";

const PlayerWithoutWorker: FC<WsPlayerProps> = ({
  height = 600,
  width = 600,
  wsUrl,
  debug,
  style,
  loaderProps,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const manageWebSocketConnection = (): void => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      try {
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = (event) => {
          log({
            message: "WebSocket connection opened.",
            type: "message",
            enabled: debug,
            event,
          });
        };

        socketRef.current.onclose = (event) => {
          log({
            message: "WebSocket connection closed.",
            type: "warning",
            enabled: debug,
            event,
          });
        };

        socketRef.current.onerror = (event) => {
          log({
            message: "WebSocket error",
            type: "error",
            enabled: debug,
            event,
          });
          if (isLoading) {
            setIsLoading(false);
          }
        };

        socketRef.current.onmessage = (event) => {
          if (event.data instanceof Blob) {
            const blobURL = URL.createObjectURL(event.data);
            const image = new Image();

            image.onload = () => {
              if (ctx) {
                // Clear the canvas
                ctx.clearRect(
                  0,
                  0,
                  width || canvas?.width || 0,
                  height || canvas?.height || 0,
                );
                // Draw the image on the canvas
                ctx.drawImage(
                  image,
                  0,
                  0,
                  width || image.width,
                  height || image.height,
                );
              }
              if (isLoading) {
                setIsLoading(false);
              }
            };

            image.src = blobURL;
          }
        };
      } catch (err) {
        log({
          message: "WebSocket connection failed.",
          type: "error",
          enabled: debug,
        });
        if (isLoading) {
          setIsLoading(false);
        }
      }
    };

    manageWebSocketConnection();

    return () => {
      log({
        message: "Component unmounted. Closing WebSocket connection.",
        type: "warning",
        enabled: debug,
      });
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
      }}
    >
      <canvas
        ref={canvasRef}
        style={style}
        width={width || "100%"}
        height={height || "100%"}
      />
      {loaderProps?.show && isLoading ? (
        <PlayerLoader {...loaderProps} />
      ) : null}
    </div>
  );
};

export default PlayerWithoutWorker;
