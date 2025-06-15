import * as React from "react"

import { toast as sonnerToast } from "sonner"

type Toast = typeof sonnerToast

type ToastFn = (props: Parameters<Toast>[0]) => ReturnType<Toast>

const useToast = () => {
  const toast: ToastFn = React.useCallback((props) => {
    return sonnerToast(props)
  }, [])

  return { toast }
}

export { useToast }
