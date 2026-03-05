import { useRef, useEffect } from "react";
import {
  PreviewPanel,
  type PreviewPanelHandle,
} from "#/components/features/preview/preview-panel";

// Global ref to access preview panel refresh method
let previewPanelRef: PreviewPanelHandle | null = null;

export function getPreviewPanelRef(): PreviewPanelHandle | null {
  return previewPanelRef;
}

function Preview() {
  const ref = useRef<PreviewPanelHandle>(null);

  useEffect(() => {
    previewPanelRef = ref.current;
    return () => {
      previewPanelRef = null;
    };
  }, []);

  return <PreviewPanel ref={ref} />;
}

export default Preview;
