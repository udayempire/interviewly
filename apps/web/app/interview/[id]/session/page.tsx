import { AppbarInterviewSession } from "@/components/interviewSession.tsx/appbarInterviewSession";
import { Conversations } from "@/components/interviewSession.tsx/conversations";
import { Participants } from "@/components/interviewSession.tsx/participants";

export default function InterviewPage() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <AppbarInterviewSession />
            <div className="grid grid-cols-[65%_35%] flex-1 min-h-0 bg-zinc-100">
                <div className="p-4 flex flex-col min-h-0">
                    <Participants />
                    <div className="mt-4 flex-1 min-h-0">
                        <Conversations />
                    </div>
                </div>
                <div className="bg-orange-100">
                    hello
                </div>
            </div>
        </div>
    )
}