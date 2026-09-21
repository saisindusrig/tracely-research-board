"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name:"",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>)=>{
                setFormData({...formData, [e.target.name]: e.target.value});        
    }
    const handleSubmit = async(e: React.FormEvent)=>{
        e.preventDefault();
        setError("");
        try{
            const res= await fetch("/api/register",{
                method: "POST",
                headers: {"Content-Type": "application/json",},
                body: JSON.stringify(formData),
            });
            if(res.ok){
                router.push("/api/auth/signin");

            }else{
                const data = await res.json();
                setError( data.message || "Registration failed.");
            }
        } catch(error){
            setError("Something went wrong. Please try again");

        }
    }
    return (
        <main className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-slate-200">
            <h1 className="text-2xl font-bold text-center text-slate-900 mb-6">Join Tracely</h1>

            {error && (
                <div className="bg-red-200 text-red-600 p-3 rounded-md text-sm mb-4">
                    {error}
                    </div>
            )}
            <form onSubmit = {handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Name</label>
                <input type="text" name="name" required className="border border-slate-300 rounded-md p-2 focus: outline-blue-500"
                onChange={handleChange}/>
                </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                <input type="email" name="email" required className="border border-slate-300 rounded-md p-2 focus: outline-blue-500"
                onChange={handleChange}/>
                </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                <input type="password" name="password" required className="border border-slate-300 rounded-md p-2 focus: outline-blue-500"
                onChange={handleChange}/>
                </div>
                <Button type="submit" className="mt-4 w-full">
                    Sign Up
                </Button>
            </form>
            <p>
                Already have an account? {" "}
                <Link href="/api/auth/signin" className="text-blue-600 hover:underline"> Log in here</Link>
            </p>
            </div>
        </main>
    );
}