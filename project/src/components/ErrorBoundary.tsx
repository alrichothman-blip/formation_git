import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can log error to a remote service here
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <h2 className="text-lg font-bold text-red-600">Une erreur est survenue</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Veuillez réessayer ou contacter l'administrateur. Erreur: {this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children as any;
  }
}

