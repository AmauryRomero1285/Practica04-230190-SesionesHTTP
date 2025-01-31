import userData from "../data/users.data.js";

const userController = {};

userController.insert = (req, res) => {
  userData
    .insert(req.body)
    .then((session) => {
      res.status(200).json({ message: "Usuario registrado exitosamente",user:session });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message:error});
    });
};
userController.update = (req, res) => {
  userData
    .update(req.params.sessionID, req.body)
    .then((user) => {
      res.status(200).json({
        date: {
          message: "Usuario actualizado exitosamente",
          user: user,
        },
      });
    })
    .catch((error) => {
      res.status(500).json({
        data: {
          message: error,
        },
      });
    });
};
userController.showUsers = (req, res) => {
  userData
    .showUsers()
    .then((user) => {
        res.status(200).json({
            data:{
                message:"Busqueda Exitosa",
                users:user
            }
        })
    })
    .catch((error) => {
      res.status(500).json({
        data: { message: error },
      });
    });
};
