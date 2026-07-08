import { InterviewActionCards } from "@/components/home/interviewActionCards";

export default function Home() {
    return (
        <div className="grid grid-cols-[70%_30%] min-h-screen">
            <div className=" p-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Welcome back, Uday ! 👋</h1>
                    <h2 className="text-lg font-ex text-gray-700">What would you like to do today?</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 p-2 mt-6">
                    <InterviewActionCards
                        title={"Join an Interview"}
                        description={"Enter an Interview code provided by your company/recruiter to join."}
                        buttonDescription={"Join Interview"}
                    />
                    <InterviewActionCards
                        title={"Create Instant Interview"}
                        description={"Start a practice Interview instantly with your resume and Github."}
                        buttonDescription={"Create Interview"}
                    />
                </div>
            </div>

            <div className="bg-orange-100 p-6">
                Right (30%)
            </div>
        </div>
    );
}