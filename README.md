## Introduction

---

Welcome to the installation and set up guide for _CGH's Data Management Web Application._

The instructions for the installation may get rather complicated but feel free to read through the setup guide and/or reach out to the repo's owner for help.

First of all

- **_NO_**, your work laptops issued by CGH will **_NOT_** be able to run this and
- **_NO_** your phones will not be able to run this (for now).

If you do not have a personal laptop, go and borrow someone else's, or wait till CGH decides to deploy this into the intranet or internet .

_Fun fact : What you are reading right now is called a "README" file_

_Programmers/ Developers typically use, as a way of good practice, following the industry standard to document everything important and information about the project for the users and/or client._

_If you find this file in the folders, it may look really confusing and different but do not worry about it because it is written in markdown format._

## Table of Contents

---

1. [Introduction](#introduction)
2. [Technical Requirements](#requirements)
   1. [Basic Command Line Navigation](#basiccommandline)
3. [Getting Started](#gettingstarted)
   1. [Downloading the IDE](#downloadide)
   2. [Cloning the Repository](#clonefrontend)
   3. [Installing Dependencies](#installdep)
4. [Running the Web Application](#running)
5. [What to Expect](#outcome)

<a id="requirements"></a>

## Getting Started:

---

### This webapp will require the following:

- A "Can Do" Attitude!
- Not afraid of new challenges!
- A personal laptop with Internet access
- Experience with a mouse and keyboard
- Entry level knowledge of command lines (will be taught to you in the next portion don't worry!)

### Basic Command Line Navigation

_Skip this portion if you are familiar with changing directories using powershell, bash etc_

If you’re new to using the command line, here are a couple of essential commands to help you navigate through folders (directories) on your computer.

1. **Changing Directories: cd**
   The cd command stands for "change directory." It allows you to move into a different folder on your computer. Think of it as opening a folder in your file explorer.

_How to Use_:

To move into a folder:
Type cd followed by the name of the folder you want to move into. For example, if you want to move into a folder called "Documents," you would type:

```
cd Documents
```

After pressing Enter, you’ll now be "inside" the Documents folder.

2. **Moving Up a Level/ Moving back out: cd ..**
   The cd .. command allows you to move up one level in your folder hierarchy. If you’re inside a folder and want to go back to the folder that contains it, this is the command to use.

_How to Use_:

To go back one level:
Simply type cd .. and press Enter. This will move you out of your current folder and into the folder that contains it.

For example, if you were inside the "Documents" folder and you typed:

```
cd ..
```

You would move out of "Documents" and back to the folder where "Documents" is located (often your main user folder).

<a id="gettingstarted"></a>

## Installation Guide

---

### Downloading an IDE

_Fun Fact: What’s an IDE?_

_An IDE (Integrated Development Environment) is like a supercharged word processor for coding. Just as a writer uses a notebook, developers use an IDE to write, test, and fix their code—all in one handy tool. It’s where the magic of software creation happens!_

Recommended : **Visual Studio Code** or any preferred IDEs of your choice

[Download Visual Studio Code](https://code.visualstudio.com/download)

If you are on a windows laptop, download the windows version

Launch it when download is completed!
<a id="clonefrontend"></a>

### Cloning the repository

WHAT DOES CLONING MEAN -

Don't worry about the terminologies, just follow the instructions below!

Launch VSC once you downloaded it and press **_Ctrl_** followed by **_`_** (this is the ~ button below your ESC button)

**_A terminal should open up._**

Change Directory (using **_cd_**) into your preferred location to download the project.

For example, if I am at C drive and I want to install the web application in "CGH_Project", I will :

```
cd SUTD/Internship/CGH_Project
```

and then copy and paste or type the code below :

```shell
git clone https://github.com/CoderJae777/CGH_Project.git
```

Before you press enter, it should look like this :

```
PS C:\SUTD\Internship\CGH_Project git clone https://github.com/CoderJae777/CGH_Project.git
```

Once done, press enter and let it download! You are 80% done!
<a id="installdep"></a>

### Installing dependencies

WHAT DOES DEPENDENCIES MEAN -

Again, do not worry, it is just a fancy terminology we use to sound smart, its just things the web app will need to function normally, like how coffee is my dependencies haha...

Assuming you have no issues with the above step,

In the same terminal, cd into cgh_project, copy and paste or type the following code (this may take awhile) :

```shell
npm install
```

In the event of errors there are 2 things you can do :

```shell
npm audit fix
```

```shell
npm audit fix --force
```

Else, contact developers if you still run into issuess

<a id="running"></a>

## Running the web application

---

In the same terminal, copy and paste or type the following code:

```shell
npm start
```

<a id="outcome"></a>

## What to expect

---

Your chrome will automatically launch and the web application will start.

If your web browser did not start automatically, click this link :
[http://localhost:3000](http://localhost:3000)

## Features

---

### Management

#### Home Page

- Filter
- Sorting
- Quick Summary
- Pages (Not sure if this a ft yet)

#### Data Entry

- Edit Doctor Data
- Add new Doctor data
- Download button

## Potential Errors/FAQs

---

Note if you are a mac user, good luck, whatever problems you have is beyond me.

If you are a windows user, you are in good hands.

Here are some potential errors you may encounter during installation, along with solutions based on user feedback:

1. **Error:** Not sure which destination to save the web application into.

   **Solution:** By default, if you’re unsure where to save the web application, navigate (`cd`) all the way out to the C drive, then `cd` into the "Downloads" folder.

2. **Error:** Installation issues with VSC

## Backend Data Management using mySQL workbench

---

Things you may need frequently :

- Stored procedure to view all data

```sql
call show_data()
```

---
