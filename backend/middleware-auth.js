const jwt = require('jsonwebtoken');

function authRequired(req, res, next){
  const header = req.headers?.authorization || '';
  const [scheme, token] = header.split(' ');

  if(scheme !== 'Bearer' || !token){
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };

    return next();
  }catch(err){
    return res.status(401).json({ error:'Invalid/expired token' });
  }
}

module.exports = { authRequired };

