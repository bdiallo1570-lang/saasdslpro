import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  active: boolean;
}

const SCANNER_ELEMENT_ID = 'dsl-qr-scanner';

export function QrScanner({ onScan, active }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return;

    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!stopped) {
            onScanRef.current(decodedText);
          }
        },
        undefined,
      )
      .catch((err) => {
        console.error("Impossible de démarrer la caméra pour le scan QR :", err);
      });

    return () => {
      stopped = true;
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [active]);

  return <div id={SCANNER_ELEMENT_ID} className="w-full rounded-lg overflow-hidden bg-black" />;
}
