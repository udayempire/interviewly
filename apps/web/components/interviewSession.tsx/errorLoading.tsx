export const ErrorLoading = () => {
    return (
        <div className="flex flex-col h-screen bg-zinc-900 items-center justify-center text-white p-6 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Failed to join interview room</h2>
            <p className="text-sm text-zinc-400 mb-4">Please check if your backend server is running and your session token is valid.</p>
            <button
                onClick={() => window.location.reload()}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-md text-sm transition-colors cursor-pointer"
            >
                Retry Connection
            </button>
        </div>
    );
}