# Acquire.js

## State Tester

### Summary
This is a Node.js implementation of the "state tester" for the Acquire game.

### About Node.js
Taken from the [Node.js web site](http://www.nodejs.org):

> Node.js is a platform built on Chrome's JavaScript runtime for easily building fast, scalable network applications. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient, perfect for data-intensive real-time applications that run across distributed devices.

### XML API
The XML API communicates using standard input and output.

#### Input Example
	<place row="E" column="2" hotel="American">
		<state>
			<board>
				<tile column="1" row="E" />
				<tile column="1" row="A" />
				<hotel name="Continental">
					<tile column="1" row="B" />
					<tile column="1" row="C" />
				</hotel>
			</board>
			<player name="Jake" cash="100">
				<share name="Continental" count="1" />
				<tile column="2" row="A" />
				<tile column="3" row="A" />
				<tile column="2" row="E" />
			</player>
			<player name="Jim" cash="10000">
				<tile column="4" row="D" />
				<tile column="3" row="D" />
			</player>
			<player name="Abby" cash="1000000">
				<tile column="6" row="B" />
			</player>
			
		</state>
	</place>

#### Output Example
    <state>
	<board>
	<tile column="1" row="A" />
	<hotel label="Continental">
	<tile column="1" row="B" />
	<tile column="1" row="C" />
	</hotel>
	<hotel label="American">
	<tile column="1" row="E" />
	<tile column="2" row="E" />
	</hotel>
	</board>
	<player name="Jake" cash="100">
	<share name="American" count="1" />
	<share name="Continental" count="1" />
	<tile column="2" row="A" />
	<tile column="3" row="A" />
	</player>
	<player name="Jim" cash="10000">
	<tile column="3" row="D" />
	<tile column="4" row="D" />
	</player>
	<player name="Abby" cash="1000000">
	<tile column="6" row="B" />
	</player>
	</state>

## Development Notes

### Folder Structure
* **bin** - contains the Node.js binary
* **docs** - contains documentation
* **lib** - contains our Acquire classes
* **lib-cov** - contains the JSCoverage-generated versions of our Acquire classes for unit test coverage reporting
* **node_modules** - contains the Node modules used.  This includes our XML parser, StableXML, that is used to parse the XML in the state tester artifact.
* **state-tests** - contains the XML tests
* **test** - contains the unit test JavaScript

### Data Types
There are many common data types used throughout the Acquire.js code.  To avoid accidental inconsistencies and data duplication, you can find these common data types in **Data Types.txt**, which can be found in the **docs** folder.

### Running board-tester on CCIS Lab Machines
There is a provided bash script called **state-tester** which will execute the necessary commands to run the  Acquire.js board tester.  However, you may need to grant "execute" permissions to the provided **node** binary (found in the **bin** folder), as well as the **state-tester** bash script, in order to successfully execute the tester.

### Running board-tester on any other machine
The included **node** binary and **state-tester** script should run on any Linux machine.

In order to run this code on another machine, first [download Node.js](http://www.nodejs.org/download/) for your operating system.  Then, once you have it properly installed, you should be able to…

1. Change directory into the acquire.js directory
2. Run `node state-tester.js` from the terminal.

### Running Unit Tests
Unfortunately, running the unit tests requires some amount of system modification.

1. First, run `apt-get install npm` to install the Node package manager.
2. Once NPM is installed, run `npm install -g mocha`
3. You can then run our tests by running `make test`