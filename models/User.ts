import mongoose, {Schema, models} from "mongoose";
const userSchema = new Schema (
    {
        email:{
            type:String,
            required:true,
            unique: true,
        },
        name:{
            type: String,
            required: true,
        },
        image: {
            type:String,
        },
        password: {
            type: String,
            select: false,
        },
    },

    {timestamps:true}
)
const User = models.User || mongoose.model("User", userSchema);
export default User;