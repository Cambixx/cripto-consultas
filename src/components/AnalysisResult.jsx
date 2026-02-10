import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, AlertTriangle, Copy, Check, FileText, Download, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import copy from 'copy-to-clipboard';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AnalysisResult = ({ analysis, isLoading, error }) => {
    const [copied, setCopied] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleCopy = () => {
        if (analysis) {
            copy(analysis);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleExport = async () => {
        const element = document.getElementById('analysis-report');
        if (!element) return;

        setIsExporting(true);
        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#020617', // Match --background
                scale: 2,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`CryptoOracle_Report_${Date.now()}.pdf`);
        } catch (err) {
            console.error("Export failed:", err);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        // ... same loading state ...
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-4xl mx-auto p-12 text-center space-y-4"
            >
                <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent italic">
                        Consultando el Oráculo Digital...
                    </p>
                    <p className="text-muted-foreground text-sm font-mono animate-pulse">
                        Calculando confluencias MTA y estructuras de mercado...
                    </p>
                </div>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl mx-auto p-6 bg-destructive/5 border border-destructive/20 rounded-2xl text-center"
            >
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
                <h3 className="text-xl font-bold text-destructive mb-2">Error de Análisis</h3>
                <p className="text-destructive-foreground/80 max-w-md mx-auto">{error}</p>
            </motion.div>
        );
    }

    if (!analysis) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto bg-black border-4 border-white neo-shadow overflow-hidden"
        >
            <div className="bg-primary p-4 sm:p-6 border-b-4 border-white flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-black border-2 border-white">
                        <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-black text-2xl tracking-tighter text-black uppercase italic">INFORME DE INTELIGENCIA</h2>
                        <p className="text-[10px] text-black/70 font-mono font-bold">GEMINI 3 PRO • ANALYSIS CORE v3.1</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white border-2 border-white hover:bg-white hover:text-black transition-all text-sm font-black uppercase tracking-widest"
                    >
                        {isExporting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        EXPORT.PDF
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopy}
                        className={`
                            flex items-center gap-2 px-5 py-2.5 border-2 transition-all text-sm font-black uppercase tracking-widest
                            ${copied
                                ? 'bg-white text-black border-white'
                                : 'bg-black text-white border-white hover:bg-white hover:text-black'}
                        `}
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4" /> COPIADO
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" /> CLONAR.TXT
                            </>
                        )}
                    </motion.button>
                </div>
            </div>

            <div id="analysis-report" className="p-8 sm:p-12 prose prose-invert max-w-none font-mono
                prose-headings:text-primary prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase
                prose-p:text-white prose-p:leading-relaxed prose-p:text-sm
                prose-strong:text-primary prose-strong:font-black
                prose-code:text-primary prose-code:bg-white/10 prose-code:px-2 prose-code:py-0.5
                prose-ul:list-square prose-li:text-white/90
            ">
                <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>

            <div className="bg-black p-4 border-t-2 border-white/10 text-center px-6">
                <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-bold leading-relaxed">
                    [ ADVERTENCIA: OPERACIONES DE ALTO RIESGO. ESTE ANALISIS ES UNICA Y EXCLUSIVAMENTE EXPERIMENTAL ]
                </p>
            </div>
        </motion.div>
    );
};

export default AnalysisResult;
