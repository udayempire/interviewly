export const Participants = () => {
    return (
        <div className="border rounded-lg bg-white py-10">
            <div className="grid grid-cols-2 gap-2 px-5 rounded-md">
                <div className="p-2 py-8  bg-zinc-900 rounded-md flex justify-center items-center">
                    <div className="bg-purple-400 rounded-full h-60 w-60 flex justify-center items-center">
                        <h1 className="font-bold text-white text-4xl">AI</h1>
                    </div>
                </div>
                <div className="p-2 py-6  bg-zinc-900 rounded-md flex justify-center items-center">
                    <div className="bg-purple-400 rounded-full h-60 w-60 flex justify-center items-center">
                        <h1 className="font-bold text-white text-4xl">U</h1>
                    </div>
                </div>
            </div>
        </div>
    )
}