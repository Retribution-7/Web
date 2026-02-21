# Anton Radkov

### Data Scientist & ML Engineer

**Location:** Mogilev, Belarus  
**Last update:** Feb 2026

## 📬 Contact & Social

- 📞 **Phone:** +375 44 483 70 96
- ✉️ **Email:** ant.radkov@gmail.com
- 🐙 **GitHub:** https://github.com/Retribution-7

---

## 👤 Profile Snapshot

Passionate **aspiring Data Scientist** with a strong foundation in software development.  
Currently focused on mastering **Machine Learning and Data Science**.

**Strengths:**

- Analytical thinking
- Quick learner
- Persistence in problem-solving
- Strong mathematical background

Although I have no formal business experience yet, I have completed several practical projects, including API development and CLI tools, and I am actively transitioning into the field of Data Science.

---

## ⚙️ Technical Skills

### 💻 Languages

- Python
- JavaScript / TypeScript
- C#
- SQL
- HTML / CSS

### 🚀 Frameworks

- React
- Nest.js
- Node.js
- Prisma

### 🛠️ Tools

- Git
- Docker
- Kaggle
- Postman

### 📊 ML / Data Science

- Intermediate Machine Learning
- Feature Engineering
- Pandas
- NumPy
- Scikit-learn

---

## 📁 Study & Projects

### 🌤️ Weather CLI

**GitHub:** https://github.com/Retribution-7/Weather-cli

Command-line interface for retrieving weather information.  
Built with JavaScript using a public weather API.

**Skills:** JavaScript, Node.js, CLI development, REST API

---

### 👥 Group Monitor API

**GitHub:** https://github.com/Retribution-7/group-monitor-api

API for monitoring student information, designed for group leaders.  
Backend TypeScript application.

**Skills:** TypeScript, Nest.js, Prisma, PostgreSQL, REST API design

---

### 📊 Synthetic Data Generator (ML Practice)

Function to generate synthetic user data for ML training.

```python
def generate_users(n_users: int = 5000, seed: int = 42) -> pd.DataFrame:
    users = pd.DataFrame()
    np.random.seed(seed)

    users['Id'] = range(1, n_users + 1)
    users['Age'] = np.random.normal(loc=35, scale=10, size=n_users).astype(int)
    users['Age'] = users['Age'].clip(18, 70)
    users['Income'] = np.random.lognormal(mean=np.log(550), sigma=0.5, size=n_users).astype(int)
    users['Region'] = generate_region(n=n_users)
    users['RegistrationDate'] = generate_date(n=n_users)
    users['Engagement'] = generate_engagement(income=users['Income'])

    users = users.set_index('Id')

    return users
```

---

## 📚 Courses & Certificates

### 🎓 PurpleSchool

- React development  
- Node.js course  
- Nest.js framework  
- TypeScript fundamentals  
- JavaScript advanced  

### 📊 Kaggle

- Python for Data Science  
- Intermediate Machine Learning  
- Feature Engineering  
- Data Visualization  

---

## 🌐 English Proficiency

**Level:** B1 (Intermediate)

**Practice:**

- Reading technical documentation  
- Code comments in English  
- Participation in English-speaking developer communities  
- Watching tech tutorials and conferences  

Currently working on improving to **B2 level**.
