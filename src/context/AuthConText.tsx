import { createContext, ReactNode, useContext } from "react";
import { useState } from "react";
import { Alert } from "react-native";

interface AuthContextType {
    isAuthenticated  : boolean
    user : string | null
    userToken : string | null
    isLoading : boolean ;
    signIn : (email : string , password : string) => Promise<void>
    signOut : () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({children} : {children : ReactNode}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState<string | null >(null);
    const [isAuthenticated , setIsAuthenticated] = useState(false)



    const signIn = async (email : string, password : string) => {
        if(email == "admin" && password == "12345"){
            setUser(email)
            setIsAuthenticated(true)
            Alert.alert('Đăng nhập thành công')
        }
    }
    
    const signOut = async () => {
        setUser(null)
        setIsAuthenticated(false)
    }

    return(
        <AuthContext.Provider value={{isLoading, signIn, signOut, userToken, user, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context){
        throw new Error(
            'useAuth must be used inside AuthProvider',
        );
    }
    return context;
}