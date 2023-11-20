export const templateJavaProblem = `public class %%pascalName%% {
    public static void main(String[] args) {
        System.out.println("Hello %%pascalName%%!");
    }
}`;

export const templateCSharpGitIgnore = `*.sln
**/bin
**/obj`;

export const templateCSharpProblem = `public class %%pascalName%%
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hello %%pascalName%%!");
    }
}`;

export const templateCSharpProblemProj = `<Project Sdk="Microsoft.NET.Sdk">

<PropertyGroup>
  <OutputType>Exe</OutputType>
  <TargetFramework>net7.0</TargetFramework>
  <ImplicitUsings>enable</ImplicitUsings>
  <Nullable>enable</Nullable>
</PropertyGroup>

</Project>`;
