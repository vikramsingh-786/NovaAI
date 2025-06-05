import { toast as reactToast } from "react-toastify";

interface ToastOptions {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  autoClose?: number;
  hideProgressBar?: boolean;
}

export function useToast() {
  const toast = {
    success: (message: string, options?: ToastOptions) => {
      reactToast.success(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        ...options,
      });
    },
    error: (message: string, options?: ToastOptions) => {
      reactToast.error(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        ...options,
      });
    },
    info: (message: string, options?: ToastOptions) => {
      reactToast.info(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        ...options,
      });
    },
    warning: (message: string, options?: ToastOptions) => {
      reactToast.warn(message, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        ...options,
      });
    },
  };

  return toast;
}
