# Airborne to Disk (and back again)

Airborne-to-disk is a CLI tool that can be used to persist or restore a set of Airborne database definitions to/from disk. The persistence is in the form of a set of JSON files for each `thing` found in each of the configured databases. 

## Installation

* `npm install -g git+ssh://git@github.com:theVolary/airborne-to-disk.git`

## Usage

Once installed, the `airborne-to-disk` command can be run from a folder that contains a configuration file or files. Airborne-to-disk uses [feather-config](https://github.com/theVolary/feather-config) which means configuration will be in the form of a `config.json` file at the top level and optionally include a `conf` folder that has environment specific configurations. A side benefit of using feather-config is that this command can also conveniently be run directly from within an existing `feather` project.

It is important to note that both the write and restore modes of this tool require that the airborne instances be running. This is because this tool uses airborne's REST interface to fetch and write the thing/schema definitions.
  
### Command line arguments

* `--path <path_to_directory>` (REQUIRED) - this argument is the complete absolute path to the directory you wish to write the database definitions to (or restore from)
* `--restore` - this is a flag that tells airborne-to-disk to read the database definitions from the directory specified via the `--path` argument and write to the airborne datase(s) found in config.
* `env <environment_name>` - this argument tells feather-config which environment configuration to use (behaves exactly as feather's `-e` alias)

### Example Configuration

In order for this tool to work, your config.json (or conf/<environment>.json) must include an `airborne` config section, like in the below example:

```
{
  "airborne": {
    
    "someDatabase1": {
      "enabled": true,
      "url": "http://localhost:8180"
    },
    
    "someDatabase2": {
      "enabled": true,
      "url": "http://localhost:8280"
    }
  }
}
```

This tells airborne-to-disk to create two instances of airborne_client, pointing at airborne instances running on localhost ports 8180 and 8280, respectively.

### Writing to disk

The default form of the airborne-to-disk command is to do just that, write to disk. The following is an example of running the command and what the expected output will be.

```
$ airborne-to-disk --path /home/projects/airborne/ab_project1
Writing complete.
```

Assuming the airborne database on port 8180 has a thing called `person` and the one at port 8280 has a thing called `animal`, you will now see the following file structure at `/home/projects/airborne/ab_project1`:

```
|-- someDatabase1
  |-- person
    |-- designDoc.json
    |-- schema.json
    |-- thing.json

|-- someDatabase2
  |-- animal
    |-- designDoc.json
    |-- schema.json
    |-- thing.json
```

NOTE: while these files are all saved with the `.json` extension, the `thing` and `designDoc` files will probably not pass JSON validation as stored on disk. This is because we break up single-line sections of code by adding newline characters and a special commenting scheme so that code blocks are easier to read by a human (especially in the context of a source control system command, e.g. `git diff`).

### Restoring from disk

Using the same example databases from above, in order to restore a database from a previously saved spec you simply add the `--restore` flag to the command. Here is an example with expected command line output:

```
$ airborne-to-disk --path /home/projects/airborne/ab_project1 --restore
Restore complete.
```

NOTE: when restoring, the named airborne instances in your config file need to match the folder names in the restore target directory. Under the above recommended usage pattern that should of course always be true, but it is something you should be aware of in case you want to start renaming these folders (for some weird reason) or you change the names of your airborne config sections (for some weird reason).
