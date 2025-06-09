import React, { useRef, useEffect, useState } from "react";
import { BsCamera, BsX } from "react-icons/bs";
import jsQR from "jsqr";

const QRScanner = ({ onCodeDetected, onError, disabled = false }) => {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      setCameraError("");
      setScanning(true);

      if (location.protocol !== "https:" && location.hostname !== "localhost") {
        const errorMsg = "Camera access requires HTTPS. Please use a secure connection.";
        setCameraError(errorMsg);
        setScanning(false);
        onError?.(errorMsg);
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = "Camera not supported on this device/browser.";
        setCameraError(errorMsg);
        setScanning(false);
        onError?.(errorMsg);
        return;
      }

      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);

      let errorMessage = "Unable to access camera. ";

      if (error.name === "NotAllowedError") {
        errorMessage += "Please allow camera permissions in your browser settings.";
      } else if (error.name === "NotFoundError") {
        errorMessage += "No camera found on this device.";
      } else if (error.name === "NotSupportedError") {
        errorMessage += "Camera not supported on this browser.";
      } else if (error.name === "NotReadableError") {
        errorMessage += "Camera is already in use by another application.";
      } else {
        errorMessage += "Please check permissions and try again.";
      }

      setCameraError(errorMessage);
      setScanning(false);
      onError?.(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setCameraError("");
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        stopCamera();
        onCodeDetected(code.data);
      }
    } catch (error) {
      console.error("Error scanning QR code:", error);
    }
  };

  useEffect(() => {
    let interval;
    if (scanning && videoRef.current) {
      interval = setInterval(scanQRCode, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanning]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <>
      {scanning && (
        <div className="mb-6 relative">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
            <button
              onClick={stopCamera}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
            >
              <BsX className="text-xl" />
            </button>
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">Point your camera at the QR code to scan</p>
        </div>
      )}

      <button
        type="button"
        onClick={startCamera}
        className="p-2 text-theme-secondary transition-colors"
        disabled={disabled || scanning}
        title="Open Camera to Scan QR Code"
      >
        <BsCamera className="text-xl" />
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default QRScanner;
