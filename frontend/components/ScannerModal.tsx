import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface ScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
    title?: string;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScan, title = "Ler Código de Barras" }) => {
    useEffect(() => {
        if (isOpen) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render((decodedText) => {
                scanner.clear();
                onScan(decodedText);
            }, (error) => {
                // console.warn(error);
            });

            return () => {
                scanner.clear().catch(console.error);
            };
        }
    }, [isOpen, onScan]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="bg-cyan-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-cyan-600" />
                </div>

                <h3 className="font-bold text-xl text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm mb-6">Aponte a câmera para o código de barras ou QR Code</p>

                <div id="reader" className="w-full mb-4 bg-slate-100 rounded-lg overflow-hidden border border-slate-200"></div>

                <button
                    onClick={onClose}
                    className="w-full bg-slate-100 hover:bg-slate-200 p-3 rounded-lg text-slate-700 font-bold transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};
