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
            className="w-full max-w-5xl mx-auto glass rounded-2xl neo-shadow overflow-hidden border border-white/10"
        >
            <div className="bg-primary/5 p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl tracking-tight">Plan de Trading IA</h2>
                        <p className="text-xs text-muted-foreground font-mono">Generado por Gemini Pro • MTF Analysis Engine</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-foreground disabled:opacity-50"
                    >
                        {isExporting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Exportar PDF
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopy}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium
                            ${copied
                                ? 'bg-green-500/10 border-green-500/50 text-green-400'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-foreground'}
                        `}
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4" /> Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" /> Copiar Plan
                            </>
                        )}
                    </motion.button>
                </div>
            </div>

            <div id="analysis-report" className="p-6 sm:p-8 prose prose-invert max-w-none 
                prose-headings:text-primary prose-headings:font-bold prose-headings:tracking-tight
                prose-p:text-foreground/90 prose-p:leading-relaxed
                prose-strong:text-primary prose-strong:font-bold
                prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1 prose-code:rounded
                prose-ul:list-disc prose-li:text-foreground/80
            ">
                <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>

            <div className="bg-black/20 p-4 border-t border-white/5 text-center px-6">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium leading-relaxed">
                    Disclaimer: El trading de criptomonedas conlleva un alto riesgo. Este análisis es experimental y no constituye asesoría financiera. Opera bajo tu propio riesgo.
                </p>
            </div>
        </motion.div>
    );
};

export default AnalysisResult;
