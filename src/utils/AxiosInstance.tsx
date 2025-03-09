import axios from "axios";

const AxiosInstance = axios.create({
  baseURL: "https://dummyjson.com",
  
  headers: {
    "Content-Type": "application/json",
  }
});

export default AxiosInstance;
