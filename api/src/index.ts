import "reflect-metadata";
require("dotenv-safe").config();
import express from "express";
import { __prod__ } from "./constants";
import { Strategy as GitHubStrategy } from "passport-github";
import passport from "passport";
import jwt from "jsonwebtoken";
import cors from "cors";
import User from "./types/usr";
import { create } from "domain";
const axios = require('axios')

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: process.env.SERVER_API_KEY,
    /* Required for CORS support to work */
    "Access-Control-Allow-Origin": "*", // you can add the domain names here or '*' will allow all domains
    /* Required for cookies, authorization headers with HTTPS */
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Headers":
      "Origin, Content-Type, Accept, X-Auth-Token, Authorization",
    "Access-Control-Expose-Headers": "Content-Length, X-Kuma-Revision",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  },
});


async function getUser (client_id: string) {
    return instance({
      method: "POST",
      url: "/getUser",
      data: {
        client_id: client_id == null ? "" : client_id,
      },
    })
      .then((res:any) => {
        return [res.data["isError"], res.data["message"]];
      })
      .catch((e:any) => {
        return [true, e];
      });
  }
  async function createUser (user: User){
   return instance({
      method: "POST",
      url: "/createUser",
      data: {
        //@ts-ignore
        client_id:user.client_id,
        name: user.name != null ? user.name : "",
        email: user.email != null ? user.email : "",
        image: user.image != null ? user.image : "",
        profileUrl: user.profileUrl != null ? user.profileUrl : "",
      },
    })
      .then((res:any) => {
        return [res.data["isError"], res.data["message"]];
      })
      .catch((e:any) => {
        return [true, e];
      });
    }

  async function getUserById (id: string) {
    return instance({
      method: "POST",
      url: "/getUserById",
      data: {
        id: id == null ? "" : id,
      },
    })
      .then((res:any) => {
        return [res.data["isError"], res.data["message"]];
      })
      .catch((e:any) => {
        return [true, e];
      });
  }


const main = async () => {
  

  // const user = await User.create({ name: "bob" }).save();

  const app = express();
  passport.serializeUser((user: any, done) => {
    done(null, user.accessToken);
  });
  app.use(cors({ origin: "*" }));
  app.use(passport.initialize());
  app.use(express.json());
  console.log("hidee there")
  passport.use(
    new GitHubStrategy(
      {
        clientID: "6d4bdcea511f41a3d257",
        clientSecret: "69fcf10ba082b9d6c0ea94e8f501300307f53d3c",
        callbackURL: "http://localhost:3008/auth/github/callback",
      },
      async (_, __, profile, cb) => {
        // let user = await User.findOne({ where: { githubId: profile.id } });
        // if (user) {
        //   user.name = profile.displayName;
        //   await user.save();
        // } else {
        //   user = await User.create({
        //     name: profile.displayName,
        //     githubId: profile.id,
        //   }).save();
        // }
        // createUser on our server
        console.log(JSON.stringify(profile,null,2));
        const userr : User = {
          client_id: profile.id,
          name:profile.displayName,
          email:profile?.emails  == undefined ? "" : profile?.emails[0].value,
          //@ts-ignore
          image:profile._json == undefined ? "" : profile._json["avatar_url"] == undefined ? "" : profile._json["avatar_url"] ,
          profileUrl:profile.profileUrl,


        }
        console.log(profile.id);
        const ress = await createUser(userr);
        console.log(ress[1]._id["$oid"])
        //@ts-ignore
        cb(null, {
          accessToken: jwt.sign(
            //@ts-ignore
            { userId:ress[1]._id["$oid"] },
            process.env.ACCESS_TOKEN_SECRET,
            {
              expiresIn: "1y",
            }
          ),
        });
      }
    )
  );

  app.get("/auth/github", passport.authenticate("github", { session: false }));

  app.get(
    "/auth/github/callback",
    passport.authenticate("github", { session: false }),
    (req: any, res) => {
      //res.send(req.user)
      // DO not change this, vscode extension will spinup a server on the person local computer
      res.redirect(`http://localhost:54321/auth/${req.user.accessToken}`);
    }
  );

  app.get("/me", async (req, res) => {
    // Bearer 120jdklowqjed021901
    console.log("amwdaw");
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.send({ user: null });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.send({ user: null });
      return;
    }

    let userId = "";

    try {
      const payload: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      userId = payload.userId;
      
      console.log(userId);
    } catch (err) {
      res.send({ user: null });
      return;
    }

    if (!userId) {
      res.send({ user: null });
      return;
    }

    const user = await getUserById(userId);
    res.send({ user });
  });
  app.get("/", (_req, res) => {
    res.send("hello");
  });
  app.listen(3008, () => {
    console.log("listening on localhost:3008");
  });
};

main();


