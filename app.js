const{ sequelize } = require('./models');
const express = require('express');
const app = express();
const port = 3000;
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {secure:false}
}));

app.set('view engine' , 'ejs');
app.use(express.urlencoded({ extended: true}));
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/signup', async(req, res) => {
    res.render('signup');
});

app.get('/login', async(req, res) => {
    res.render('login');
});


// POST route for signup form
app.post('/signup', async (req, res) => {
    const { name, email, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const newUser = await sequelize.models.user.create({ 
            name,
            email,
            password:hashedPassword
        });
        //res.send('User registered successfully!');
        res.render('login');
        //alert('User registered successfully!');
        //return res.json(newUser)

    } catch (error) {
        res.status(500).send('Error signing up user');
    }
});

// POST route for login form
// app.post('/login', async (req, res) => {
//     const { email, password } = req.body;
    
//     try {
//         const user = await sequelize.models.user.findOne({ where: { email, password } });
        
//         if (user) {
//             res.send('Login successful!');
//         } else {
//             res.render('login')
//             //res.status(401).send('Invalid email or password');
//         }
        

//     } catch (error) {
//         res.status(500).send('Error logging in user');
//     }
// });

// POST route for login form
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await sequelize.models.user.findOne({ where: { email } });

        // Check if user exists and compare the hashed password
        if (user && await bcrypt.compare(password, user.password)) {
            // Store user in session
            req.session.user = user;

            // Redirect to dashboard
            res.redirect('/dashboard');
        } else {
            // If login fails, render login page with error message
            res.render('login', { message: 'Invalid email or password' });
        }

    } catch (error) {
        res.status(500).send('Error logging in user');
    }
});



// app.get('/dashboard', async (req, res) => {
//     res.render('dashboard');
// });


// Middleware to protect the dashboard route
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next(); // User is authenticated, proceed to the next handler
    }
    res.redirect('/login'); // Redirect to login page if not authenticated
}

// Protect the dashboard route
// app.get('/dashboard', isAuthenticated, async (req, res) => {
//     // Fetch data from the database
//     const expenses = await sequelize.models.expenses.findAll();
    
//     const expenseDescriptions = expenses.map(expense => expense.description);
//     const expenseAmounts = expenses.map(expense => expense.amount);

//     res.render('dashboard', {
//         expenseDescriptions: expenseDescriptions,
//         expenseAmounts: expenseAmounts
//     });
// });

app.get('/dashboard', isAuthenticated, async (req, res) => {
    const expenses = await sequelize.models.expenses.findAll();
    
    const expenseDescriptions = expenses.map(expense => expense.description);
    const expenseAmounts = expenses.map(expense => expense.amount);

    res.render('dashboard', {
        user: req.session.user,  // Pass the logged-in user to the view
        expenseDescriptions: expenseDescriptions,
        expenseAmounts: expenseAmounts
    });
});



// app.get('/dashboard', async (req, res) => {
//     // Fetch data from the database (example below)
//     const expenses = await sequelize.models.expenses.findAll();
    
//     const expenseDescriptions = expenses.map(expense => expense.description);
//     const expenseAmounts = expenses.map(expense => expense.amount);

//     res.render('dashboard', {
//         expenseDescriptions: expenseDescriptions,
//         expenseAmounts: expenseAmounts
//     });
// });

app.post('/dashboard', async (req, res) => {
    const { initialamount, description, amount } = req.body;

    try {
        // Save the expense to the database
        await sequelize.models.expenses.create({
            initialamount: parseFloat(initialamount),
            description: description,
            amount: parseFloat(amount)
        });

        // Redirect back to the dashboard
        res.redirect('/viewexpense');
    } catch (error) {
        res.status(500).send('Error adding expense');
    }
});

// app.get('/logout', (req, res) => {
//     req.session.destroy(() => {
//         res.redirect('/login');
//     });
// });

app.get('/viewexpense', isAuthenticated, async (req, res) => {
    const expenses = await sequelize.models.expenses.findAll();
    res.render('viewexpense', { expenses });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});





app.listen(port, async() => {
    console.log(` app listening at http://localhost:${port}`);
    await sequelize.authenticate();
        console.log('Connection to the database has been established successfully');
});

