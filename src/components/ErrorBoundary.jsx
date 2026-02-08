import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                    <div className="glass max-w-md w-full p-8 rounded-2xl border border-destructive/20 text-center space-y-6 neo-shadow">
                        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-10 h-10 text-destructive" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Sistema Interrumpido</h2>
                            <p className="text-muted-foreground text-sm">
                                El motor del Oráculo ha experimentado un error crítico inesperado.
                            </p>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl text-left">
                            <p className="text-[10px] font-mono text-destructive uppercase tracking-widest mb-1">Stack Trace Summary</p>
                            <p className="text-[12px] font-mono text-muted-foreground break-all line-clamp-3">
                                {this.state.error?.message || "Internal Engine Failure"}
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
                        >
                            <RefreshCcw className="w-5 h-5" />
                            Reiniciar Interfaz
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
