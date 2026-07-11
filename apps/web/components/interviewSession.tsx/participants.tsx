export const Participants = () => {
    return (
        <div className="border rounded-lg bg-white py-4">
            <div className="grid grid-cols-2 gap-2 px-4 rounded-md">
                <div className="p-2 py-4 bg-zinc-900 rounded-md flex justify-center items-center">
                    <div className="bg-purple-400 rounded-full h-24 w-24 flex justify-center items-center">
                        <h1 className="font-bold text-white text-2xl">AI</h1>
                    </div>
                </div>
                <div className="p-2 py-4 bg-zinc-900 rounded-md flex justify-center items-center">
                    <div className="bg-purple-400 rounded-full h-24 w-24 flex justify-center items-center">
                        <h1 className="font-bold text-white text-2xl">U</h1>
                    </div>
                </div>
            </div>
        </div>
    )
}