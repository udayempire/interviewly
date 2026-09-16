export const ErrorLoading = () => {
    return (
        <div className="flex flex-col h-screen bg-background items-center justify-center text-foreground p-6 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Failed to join interview room</h2>
            <p className="text-sm text-muted-foreground mb-4">Please check if your backend server is running and your session token is valid.</p>
            <button
                onClick={() => window.location.reload()}
                className="bg-secondary hover:bg-accent text-foreground px-6 py-2 rounded-md text-sm transition-colors cursor-pointer"
            >
                Retry Connection
            </button>
        </div>
    );
}